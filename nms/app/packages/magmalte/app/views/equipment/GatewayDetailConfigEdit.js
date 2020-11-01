/*
 * Copyright 2020 The Magma Authors.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @flow strict-local
 * @format
 */
import type {
  challenge_key,
  enodeb_serials,
  gateway_device,
  gateway_epc_configs,
  gateway_logging_configs,
  gateway_ran_configs,
  lte_gateway,
  magmad_gateway_configs,
  package_type,
} from '@fbcnms/magma-api';

import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '../../theme/design-system/DialogTitle';
import EnodebContext from '../../components/context/EnodebContext';
import FormLabel from '@material-ui/core/FormLabel';
import GatewayContext from '../../components/context/GatewayContext';
import List from '@material-ui/core/List';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import React from 'react';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import nullthrows from '@fbcnms/util/nullthrows';

import {AltFormField} from '../../components/FormField';
import {colors, typography} from '../../theme/default';
import {makeStyles} from '@material-ui/styles';
import {useContext, useState} from 'react';
import {useEnqueueSnackbar} from '@fbcnms/ui/hooks/useSnackbar';
import {useRouter} from '@fbcnms/ui/hooks';

const GATEWAY_TITLE = 'Gateway';
const RAN_TITLE = 'Ran';
const AGGREGATION_TITLE = 'Aggregation';
const EPC_TITLE = 'Epc';
const DEFAULT_GATEWAY_CONFIG = {
  cellular: {
    epc: {
      ip_block: '192.168.128.0/24',
      nat_enabled: true,
      dns_primary: '',
      dns_secondary: '',
    },
    ran: {
      pci: 260,
      transmit_enabled: true,
    },
  },
  connected_enodeb_serials: [],
  description: '',
  device: {
    hardware_id: '',
    key: {
      key: '',
      key_type: 'SOFTWARE_ECDSA_SHA256',
    },
  },
  id: '',
  magmad: {
    autoupgrade_enabled: true,
    autoupgrade_poll_interval: 60,
    checkin_interval: 60,
    checkin_timeout: 30,
    dynamic_services: [],
  },
  name: '',
  status: {
    platform_info: {
      packages: [
        {
          version: '',
        },
      ],
    },
  },
  tier: 'default',
};

const useStyles = makeStyles(_ => ({
  appBarBtn: {
    color: colors.primary.white,
    background: colors.primary.comet,
    fontFamily: typography.button.fontFamily,
    fontWeight: typography.button.fontWeight,
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    letterSpacing: typography.button.letterSpacing,

    '&:hover': {
      background: colors.primary.mirage,
    },
  },
  tabBar: {
    backgroundColor: colors.primary.brightGray,
    color: colors.primary.white,
  },
  selectMenu: {
    maxHeight: '200px',
  },
}));

const EditTableType = {
  info: 0,
  aggregation: 1,
  epc: 2,
  ran: 3,
};

type EditProps = {
  editTable: $Keys<typeof EditTableType>,
};

type DialogProps = {
  open: boolean,
  onClose: () => void,
  editProps?: EditProps,
};

type ButtonProps = {
  title: string,
  isLink: boolean,
  editProps?: EditProps,
};

export default function AddEditGatewayButton(props: ButtonProps) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <GatewayEditDialog
        open={open}
        onClose={handleClose}
        editProps={props.editProps}
      />
      {props.isLink ? (
        <Button
          data-testid={(props.editProps?.editTable ?? '') + 'EditButton'}
          component="button"
          variant="text"
          onClick={handleClickOpen}>
          {props.title}
        </Button>
      ) : (
        <Button
          variant="text"
          className={classes.appBarBtn}
          onClick={handleClickOpen}>
          {props.title}
        </Button>
      )}
    </>
  );
}

function GatewayEditDialog(props: DialogProps) {
  const {open, editProps} = props;
  const classes = useStyles();
  const {match} = useRouter();
  const [gateway, setGateway] = useState<lte_gateway>({});
  const gatewayId: string = match.params.gatewayId;
  const [tabPos, setTabPos] = useState(
    editProps ? EditTableType[editProps.editTable] : 0,
  );
  const ctx = useContext(GatewayContext);
  const onClose = () => {
    setGateway({});
    setTabPos(0);
    props.onClose();
  };

  return (
    <Dialog data-testid="editDialog" open={open} fullWidth={true} maxWidth="sm">
      <DialogTitle
        label={editProps ? 'Edit Gateway' : 'Add New Gateway'}
        onClose={onClose}
      />
      <Tabs
        value={tabPos}
        onChange={(_, v) => setTabPos(v)}
        indicatorColor="primary"
        className={classes.tabBar}>
        <Tab key="gateway" data-testid="gatewayTab" label={GATEWAY_TITLE} />;
        <Tab
          key="aggregations"
          data-testid="aggregationsTab"
          disabled={editProps ? false : true}
          label={AGGREGATION_TITLE}
        />
        <Tab
          key="epc"
          data-testid="EPCTab"
          disabled={editProps ? false : true}
          label={EPC_TITLE}
        />
        <Tab
          key="ran"
          data-testid="ranTab"
          disabled={editProps ? false : true}
          label={RAN_TITLE}
        />
        ;
      </Tabs>
      {tabPos === 0 && (
        <ConfigEdit
          isAdd={!editProps}
          gateway={
            Object.keys(gateway).length != 0 ? gateway : ctx.state[gatewayId]
          }
          onClose={onClose}
          onSave={(gateway: lte_gateway) => {
            setGateway(gateway);
            if (editProps) {
              onClose();
            } else {
              setTabPos(tabPos + 1);
            }
          }}
        />
      )}
      {tabPos === 1 && (
        <AggregationEdit
          isAdd={!editProps}
          gateway={
            Object.keys(gateway).length != 0 ? gateway : ctx.state[gatewayId]
          }
          onClose={onClose}
          onSave={(gateway: lte_gateway) => {
            setGateway(gateway);
            if (editProps) {
              onClose();
            } else {
              setTabPos(tabPos + 1);
            }
          }}
        />
      )}
      {tabPos === 2 && (
        <EPCEdit
          isAdd={!editProps}
          gateway={
            Object.keys(gateway).length != 0 ? gateway : ctx.state[gatewayId]
          }
          onClose={onClose}
          onSave={(gateway: lte_gateway) => {
            setGateway(gateway);
            if (editProps) {
              onClose();
            } else {
              setTabPos(tabPos + 1);
            }
          }}
        />
      )}
      {tabPos === 3 && (
        <RanEdit
          isAdd={!editProps}
          gateway={
            Object.keys(gateway).length != 0 ? gateway : ctx.state[gatewayId]
          }
          onClose={onClose}
          onSave={(gateway: lte_gateway) => {
            setGateway(gateway);
            if (editProps) {
              onClose();
            }
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}

type Props = {
  isAdd: boolean,
  gateway?: lte_gateway,
  onClose: () => void,
  onSave: lte_gateway => void,
};

type VersionType = $PropertyType<package_type, 'version'>;

export function ConfigEdit(props: Props) {
  const enqueueSnackbar = useEnqueueSnackbar();
  const [error, setError] = useState('');
  const ctx = useContext(GatewayContext);

  const [gateway, setGateway] = useState<lte_gateway>({
    ...(props.gateway || DEFAULT_GATEWAY_CONFIG),
    connected_enodeb_serials:
      props.gateway?.connected_enodeb_serials ||
      DEFAULT_GATEWAY_CONFIG.connected_enodeb_serials,
  });

  const [gatewayDevice, SetGatewayDevice] = useState<gateway_device>(
    props.gateway?.device || DEFAULT_GATEWAY_CONFIG.device,
  );

  const [challengeKey, setChallengeKey] = useState<challenge_key>(
    props.gateway?.device.key || DEFAULT_GATEWAY_CONFIG.device.key,
  );

  const [gatewayVersion, setGatewayVersion] = useState<VersionType>(
    props.gateway?.status?.platform_info?.packages?.[0].version ||
      DEFAULT_GATEWAY_CONFIG.status?.platform_info?.packages[0]?.version,
  );

  const onSave = async () => {
    try {
      const gatewayInfos = {
        ...gateway,
        connected_enodeb_serials:
          props.gateway?.connected_enodeb_serials ||
          DEFAULT_GATEWAY_CONFIG.connected_enodeb_serials,
        status: {
          platform_info: {
            packages: [{version: gatewayVersion}],
          },
        },
        device: {...gatewayDevice, key: challengeKey},
      };
      if (props.isAdd) {
        // check if it is not a modify during add i.e we aren't switching tabs back
        // during add and modifying the information other than the serial number
        if (gateway.id in ctx.state && gateway.id !== props.gateway?.id) {
          setError(`Gateway ${gateway.id} already exists`);
          return;
        }
      }
      await ctx.setState(gateway.id, gatewayInfos);
      enqueueSnackbar('Gateway saved successfully', {
        variant: 'success',
      });
      props.onSave(gatewayInfos);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
    }
  };
  return (
    <>
      <DialogContent data-testid="configEdit">
        <List>
          {error !== '' && (
            <AltFormField label={''}>
              <FormLabel data-testid="configEditError" error>
                {error}
              </FormLabel>
            </AltFormField>
          )}
          <AltFormField label={'Gateway Name'}>
            <OutlinedInput
              data-testid="name"
              fullWidth={true}
              value={gateway.name}
              onChange={({target}) => {
                setGateway({...gateway, name: target.value});
              }}
            />
          </AltFormField>
          <AltFormField label={'Gateway ID'}>
            <OutlinedInput
              data-testid="id"
              fullWidth={true}
              value={gateway.id}
              readOnly={props.gateway ? true : false}
              onChange={({target}) =>
                setGateway({...gateway, id: target.value})
              }
            />
          </AltFormField>
          <AltFormField label={'Hardware UUID'}>
            <OutlinedInput
              data-testid="hardwareId"
              fullWidth={true}
              value={gatewayDevice.hardware_id}
              onChange={({target}) =>
                SetGatewayDevice({
                  ...gatewayDevice,
                  ['hardware_id']: target.value,
                })
              }
            />
          </AltFormField>
          <AltFormField label={'Version'}>
            <OutlinedInput
              data-testid="version"
              fullWidth={true}
              value={gatewayVersion}
              readOnly={false}
              onChange={({target}) => setGatewayVersion(target.value)}
            />
          </AltFormField>
          <AltFormField label={'Gateway Description'}>
            <OutlinedInput
              data-testid="description"
              fullWidth={true}
              value={gateway.description}
              onChange={({target}) =>
                setGateway({...gateway, description: target.value})
              }
            />
          </AltFormField>
          <AltFormField label={'Challenge Key'}>
            <OutlinedInput
              data-testid="challengeKey"
              fullWidth={true}
              value={challengeKey.key}
              onChange={({target}) =>
                setChallengeKey({...challengeKey, key: target.value})
              }
            />
          </AltFormField>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} skin="regular">
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" color="primary">
          {props.isAdd ? 'Save And Continue' : 'Save'}
        </Button>
      </DialogActions>
    </>
  );
}

export function AggregationEdit(props: Props) {
  const [error, setError] = useState('');
  const enqueueSnackbar = useEnqueueSnackbar();
  const ctx = useContext(GatewayContext);
  const {match} = useRouter();

  const gatewayId: string =
    props.gateway?.id || nullthrows(match.params.gatewayId);
  const [
    aggregationConfig,
    setAggregationConfig,
  ] = useState<magmad_gateway_configs>(
    props.gateway?.magmad || DEFAULT_GATEWAY_CONFIG.magmad,
  );

  const handleAggregationChange = (val: boolean, key: string) => {
    const dynamicServices = [...(aggregationConfig.dynamic_services || [])];
    if (val) {
      dynamicServices.push(key);
      setAggregationConfig({
        ...aggregationConfig,
        ['dynamic_services']: dynamicServices,
      });
    } else {
      const index = dynamicServices.indexOf(key);
      if (index !== -1) {
        dynamicServices.splice(index, 1);
        setAggregationConfig({
          ...aggregationConfig,
          ['dynamic_services']: dynamicServices,
        });
      }
    }
  };

  const onSave = async () => {
    try {
      if (aggregationConfig.dynamic_services?.includes('td-agent-bit')) {
        const logging: gateway_logging_configs = {
          aggregation: {
            target_files_by_tag: {
              mme: 'var/log/mme.log',
            },
          },
          log_level: 'DEBUG',
        };
        aggregationConfig.logging = logging;
      } else {
        if (aggregationConfig.logging) {
          delete aggregationConfig.logging;
        }
      }

      const gateway = {
        ...(props.gateway || DEFAULT_GATEWAY_CONFIG),
        magmad: aggregationConfig,
      };
      await ctx.updateGateway({gatewayId, magmadConfigs: aggregationConfig});
      enqueueSnackbar('Gateway saved successfully', {
        variant: 'success',
      });
      props.onSave(gateway);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
    }
  };

  return (
    <>
      <DialogContent data-testid="aggregationEdit">
        <List>
          {error !== '' && (
            <AltFormField label={''}>
              <FormLabel error>{error}</FormLabel>
            </AltFormField>
          )}
          <AltFormField label={'Event Aggregation'}>
            <Switch
              onChange={({target}) =>
                handleAggregationChange(target.checked, 'eventd')
              }
              checked={aggregationConfig.dynamic_services?.includes('eventd')}
            />
          </AltFormField>
          <AltFormField label={'Log Aggregation'}>
            <Switch
              onChange={({target}) =>
                handleAggregationChange(target.checked, 'td-agent-bit')
              }
              checked={aggregationConfig.dynamic_services?.includes(
                'td-agent-bit',
              )}
            />
          </AltFormField>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} skin="regular">
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" color="primary">
          {props.isAdd ? 'Save And Continue' : 'Save'}
        </Button>
      </DialogActions>
    </>
  );
}

export function EPCEdit(props: Props) {
  const enqueueSnackbar = useEnqueueSnackbar();
  const [error, setError] = useState('');
  const ctx = useContext(GatewayContext);

  const handleEPCChange = (key: string, val) => {
    setEPCConfig({...EPCConfig, [key]: val});
  };

  const [EPCConfig, setEPCConfig] = useState<gateway_epc_configs>(
    props.gateway?.cellular.epc || DEFAULT_GATEWAY_CONFIG.cellular.epc,
  );

  const onSave = async () => {
    try {
      const gateway = {
        ...(props.gateway || DEFAULT_GATEWAY_CONFIG),
        cellular: {
          ...DEFAULT_GATEWAY_CONFIG.cellular,
          epc: EPCConfig,
        },
      };
      await ctx.updateGateway({gatewayId: gateway.id, epcConfigs: EPCConfig});

      enqueueSnackbar('Gateway saved successfully', {
        variant: 'success',
      });
      props.onSave(gateway);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
    }
  };

  return (
    <>
      <DialogContent data-testid="epcEdit">
        <List>
          {error !== '' && (
            <AltFormField label={''}>
              <FormLabel error>{error}</FormLabel>
            </AltFormField>
          )}
          <AltFormField label={'Nat Enabled'}>
            <Switch
              onChange={() =>
                handleEPCChange('nat_enabled', !EPCConfig.nat_enabled)
              }
              checked={EPCConfig.nat_enabled}
            />
          </AltFormField>
          <AltFormField label={'IP Block'}>
            <OutlinedInput
              data-testid="ipBlock"
              type="string"
              fullWidth={true}
              value={EPCConfig.ip_block}
              onChange={({target}) => handleEPCChange('ip_block', target.value)}
            />
          </AltFormField>
          <AltFormField label={'DNS Primary'}>
            <OutlinedInput
              data-testid="dnsPrimary"
              type="string"
              fullWidth={true}
              value={EPCConfig.dns_primary}
              onChange={({target}) =>
                handleEPCChange('dns_primary', target.value)
              }
            />
          </AltFormField>
          <AltFormField label={'DNS Secondary'}>
            <OutlinedInput
              data-testid="dnsSecondary"
              type="string"
              fullWidth={true}
              value={EPCConfig.dns_secondary}
              onChange={({target}) =>
                handleEPCChange('dns_secondary', target.value)
              }
            />
          </AltFormField>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} skin="regular">
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" color="primary">
          {props.isAdd ? 'Save And Continue' : 'Save'}
        </Button>
      </DialogActions>
    </>
  );
}

export function RanEdit(props: Props) {
  const classes = useStyles();
  const enqueueSnackbar = useEnqueueSnackbar();
  const [error, setError] = useState('');
  const ctx = useContext(GatewayContext);
  const enbsCtx = useContext(EnodebContext);
  const handleRanChange = (key: string, val) => {
    setRanConfig({...ranConfig, [key]: val});
  };
  const [ranConfig, setRanConfig] = useState<gateway_ran_configs>(
    props.gateway?.cellular.ran || DEFAULT_GATEWAY_CONFIG.cellular.ran,
  );

  const [connectedEnodebs, setConnectedEnodebs] = useState<enodeb_serials>(
    props.gateway?.connected_enodeb_serials ||
      DEFAULT_GATEWAY_CONFIG.connected_enodeb_serials,
  );
  const onSave = async () => {
    try {
      const gateway = {
        ...(props.gateway || DEFAULT_GATEWAY_CONFIG),
        cellular: {
          ...DEFAULT_GATEWAY_CONFIG.cellular,
          ran: ranConfig,
        },
        connected_enodeb_serials: connectedEnodebs,
      };
      await ctx.updateGateway({
        gatewayId: gateway.id,
        enbs: connectedEnodebs,
        ranConfigs: ranConfig,
      });
      enqueueSnackbar('Gateway saved successfully', {
        variant: 'success',
      });
      props.onSave(gateway);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
    }
  };

  return (
    <>
      <DialogContent data-testid="ranEdit">
        <List>
          {error !== '' && (
            <AltFormField label={''}>
              <FormLabel error>{error}</FormLabel>
            </AltFormField>
          )}
          <AltFormField label={'PCI'}>
            <OutlinedInput
              data-testid="pci"
              type="number"
              fullWidth={true}
              value={ranConfig.pci}
              onChange={({target}) =>
                handleRanChange('pci', parseInt(target.value))
              }
            />
          </AltFormField>
          <AltFormField label={'Registered eNodeBs'}>
            <Select
              multiple
              variant={'outlined'}
              fullWidth={true}
              value={connectedEnodebs}
              onChange={({target}) => {
                setConnectedEnodebs(Array.from(target.value));
              }}
              data-testid="networkType"
              MenuProps={{classes: {paper: classes.selectMenu}}}
              renderValue={selected => selected.join(', ')}
              input={<OutlinedInput />}>
              {Object.keys(enbsCtx.state.enbInfo).map(enbSerial => (
                <MenuItem key={enbSerial} value={enbSerial}>
                  <Checkbox checked={connectedEnodebs.includes(enbSerial)} />
                  <ListItemText
                    primary={enbsCtx.state.enbInfo[enbSerial].enb.name}
                    secondary={enbSerial}
                  />
                </MenuItem>
              ))}
            </Select>
          </AltFormField>
          <AltFormField label={'Transmit Enabled'}>
            <Switch
              onChange={() =>
                handleRanChange('transmit_enabled', !ranConfig.transmit_enabled)
              }
              checked={ranConfig.transmit_enabled}
            />
          </AltFormField>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} skin="regular">
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" color="primary">
          {props.isAdd ? 'Save And Close' : 'Save'}
        </Button>
      </DialogActions>
    </>
  );
}
